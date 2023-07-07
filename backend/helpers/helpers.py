from django.core import serializers
import json


def query_set_to_json(query_set):
    return json.loads(serializers.serialize("json", query_set))


def serializer_to_json(serializer_obj):
    return json.loads(json.dumps(serializer_obj.data))
